interface IPrompt {
  id: number;
  documentId: string;
  name: string;
  prompt: string;
  from: string | null;
  to: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

interface IMetaPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

interface IMeta {
  pagination: IMetaPagination;
}

interface IPagination {
  data: IPrompt[];
  meta: IMeta;
}

export { IPrompt, IPagination };
