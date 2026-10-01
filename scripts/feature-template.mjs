export function featureFiles(name) {
  if (
    !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name) ||
    name.length > 50 ||
    /^(?:con|prn|aux|nul|com[0-9]|lpt[0-9])$/i.test(name)
  )
    throw new Error('Use a kebab-case feature name, at most 50 characters.');
  const type = name
    .split('-')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');
  const base = '@/features/' + name;
  return {
    ['domain/' + name + '.ts']:
      'export interface ' + type + ' { readonly id: string; readonly name: string }\n',
    ['application/ports/' + name + '-repository.ts']:
      "import type { Cancellation } from '@/shared/application/cancellation';\nimport type { " +
      type +
      " } from '" +
      base +
      '/domain/' +
      name +
      "';\nexport interface " +
      type +
      'Repository { list(cancellation?: Cancellation): Promise<readonly ' +
      type +
      '[]> }\n',
    ['application/' + name + '-use-cases.ts']:
      'import type { ' +
      type +
      "Repository } from './ports/" +
      name +
      "-repository';\nexport function create" +
      type +
      'UseCases(repository: ' +
      type +
      'Repository): ' +
      type +
      'Repository { return { list: cancellation => repository.list(cancellation) }; }\nexport type ' +
      type +
      'UseCases = ReturnType<typeof create' +
      type +
      'UseCases>;\n',
    ['infrastructure/dto/' + name + '-dto.ts']:
      "import { z } from 'zod';\nexport const itemDtoSchema = z.object({ id: z.string().min(1), name: z.string().min(1) });\nexport type " +
      type +
      'Dto = z.infer<typeof itemDtoSchema>;\n',
    ['infrastructure/services/http-' + name + '-service.ts']:
      "import { z } from 'zod';\nimport type { HttpClient } from '@/shared/infrastructure/http/http-client';\nimport { parseResponse } from '@/shared/infrastructure/http/response';\nimport { itemDtoSchema } from '../dto/" +
      name +
      "-dto';\nexport const ENDPOINT = '/" +
      name +
      "';\nexport function createHttp" +
      type +
      'Service(http: HttpClient) { return { async list(signal?: AbortSignal) { const response = await http.get<unknown>(ENDPOINT, signal ? { signal } : {}); return parseResponse(response.data, z.array(itemDtoSchema)); } }; }\nexport type Http' +
      type +
      'Service = ReturnType<typeof createHttp' +
      type +
      'Service>;\n',
    ['infrastructure/mappers/' + name + '-mapper.ts']:
      'import type { ' +
      type +
      " } from '" +
      base +
      '/domain/' +
      name +
      "';\nimport type { " +
      type +
      "Dto } from '../dto/" +
      name +
      "-dto';\nexport function to" +
      type +
      '(dto: ' +
      type +
      'Dto): ' +
      type +
      ' { return { id: dto.id, name: dto.name }; }\n',
    ['infrastructure/repositories/http-' + name + '-repository.ts']:
      'import type { ' +
      type +
      "Repository } from '" +
      base +
      '/application/ports/' +
      name +
      "-repository';\nimport type { Http" +
      type +
      "Service } from '../services/http-" +
      name +
      "-service';\nimport { to" +
      type +
      " } from '../mappers/" +
      name +
      "-mapper';\nimport { requireResult } from '@/shared/infrastructure/http/response';\nimport { withApplicationErrors } from '@/shared/infrastructure/http/application-errors';\nimport { withAbortSignal } from '@/shared/infrastructure/cancellation';\nexport function createHttp" +
      type +
      'Repository(service: Http' +
      type +
      'Service): ' +
      type +
      'Repository { return { list: cancellation => withApplicationErrors(() => withAbortSignal(cancellation, async signal => requireResult(await service.list(signal)).map(to' +
      type +
      '))) }; }\n',
    ['presentation/contexts/' + name + '-context.ts']:
      "import { createContext } from 'react';\nimport type { " +
      type +
      "UseCases } from '" +
      base +
      '/application/' +
      name +
      "-use-cases';\nexport const " +
      type +
      'Context = createContext<' +
      type +
      'UseCases | null>(null);\n',
    ['presentation/providers/' + name + '-provider.tsx']:
      "import type { PropsWithChildren } from 'react';\nimport type { " +
      type +
      "UseCases } from '" +
      base +
      '/application/' +
      name +
      "-use-cases';\nimport { " +
      type +
      "Context } from '../contexts/" +
      name +
      "-context';\nexport function " +
      type +
      'Provider({ useCases, children }: PropsWithChildren<{ useCases: ' +
      type +
      'UseCases }>) { return <' +
      type +
      'Context value={useCases}>{children}</' +
      type +
      'Context>; }\n',
    ['presentation/queries/' + name + '-keys.ts']:
      "export const queryKeys = { all: ['" + name + "'] as const };\n",
    ['presentation/hooks/use-' + name + '.ts']:
      "import { useContext } from 'react';\nimport { useQuery } from '@tanstack/react-query';\nimport { fromAbortSignal } from '@/shared/infrastructure/cancellation';\nimport { " +
      type +
      "Context } from '../contexts/" +
      name +
      "-context';\nimport { queryKeys } from '../queries/" +
      name +
      "-keys';\nexport function use" +
      type +
      '() { const useCases = useContext(' +
      type +
      "Context); if (!useCases) throw new Error('" +
      type +
      "Provider is required.'); return useQuery({ queryKey: queryKeys.all, queryFn: ({ signal }) => useCases.list(fromAbortSignal(signal)) }); }\n",
    ['presentation/components/' + name + '-list.tsx']:
      'import type { ' +
      type +
      " } from '" +
      base +
      '/domain/' +
      name +
      "';\nexport function " +
      type +
      'List({ items }: { items: readonly ' +
      type +
      '[] }) { return <ul className="space-y-2">{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>; }\n',
    ['presentation/pages/' + name + '-page.tsx']:
      'import { use' +
      type +
      " } from '../hooks/use-" +
      name +
      "';\nimport { " +
      type +
      "List } from '../components/" +
      name +
      "-list';\nimport { RequestError } from '@/shared/components/request-error';\nimport { Button } from '@/shared/ui/button';\nexport function " +
      type +
      'Page({ title, loadingLabel, offlineLabel, emptyLabel, retryLabel }: { title: string; loadingLabel: string; offlineLabel: string; emptyLabel: string; retryLabel: string }) { const query = use' +
      type +
      '(); return <section><h1 className="text-2xl font-semibold">{title}</h1>{query.isPending ? <p role="status">{query.fetchStatus === "paused" ? offlineLabel : loadingLabel}</p> : query.isError ? <div className="space-y-3"><RequestError error={query.error} /><Button onClick={() => { void query.refetch(); }}>{retryLabel}</Button></div> : query.data.length ? <' +
      type +
      'List items={query.data} /> : <p>{emptyLabel}</p>}</section>; }\n',
    'README.md':
      '# ' +
      type +
      '\n\nGenerated read-only vertical slice. Proposed endpoint: GET /' +
      name +
      ', envelope result is an array of { id, name }. Confirm or mock this contract before mounting.\n\n1. Compose service -> repository -> use cases in app/composition-root.\n2. Inject through the generated provider.\n3. Add a registry route + lazy adapter with localized title/loading/offline/empty/retry labels and an appropriate permission guard.\n4. Add an MSW handler returning the same response envelope.\n5. Add invariant/contract/browser tests for your behavior.\n6. Add forms, schemas, mutation hooks and view types when needed; Projects shows full CRUD, conflict handling and unsaved changes.\n\nThe generator does not edit global routing, translations, mocks or permissions. Run npm run format and npm run check after integration.\n',
  };
}
