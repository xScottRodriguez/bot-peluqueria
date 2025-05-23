import { IPagination, IPrompt } from "src/common/interfaces";
import { envs } from "src/config/envs";

const getPromptsByName = async (name: string): Promise<IPrompt> => {
  const url = new URL(`${envs.apiPromptsUri}/prompts`);
  url.searchParams.set("filters[name][$contains]", name);

  console.log({ uri: url.toString() });
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${envs.apiPromptsToken}`,
    },
  });

  const { data }: IPagination = await response.json();
  if (data.length === 0) {
    throw new Error(`Prompt with name ${name} not found`);
  }

  return data.filter((prompt: IPrompt) => prompt.name === name)[0];
};

export { getPromptsByName };
