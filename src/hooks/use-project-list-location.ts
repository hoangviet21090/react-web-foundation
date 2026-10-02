import { useSearchParams } from 'react-router';
import { parseProjectListSearch, updateProjectListSearch } from '@/routes/project-list-search';

export function useProjectListLocation() {
  const [searchParams, setSearchParams] = useSearchParams();
  return {
    ...parseProjectListSearch(searchParams),
    changePage: (page: number) => {
      setSearchParams((current) => updateProjectListSearch(current, { page }));
    },
    changeSearch: (search: string) => {
      setSearchParams((current) => updateProjectListSearch(current, { search }));
    },
  };
}
