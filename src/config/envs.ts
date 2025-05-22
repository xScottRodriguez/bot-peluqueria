import Joi from "joi";

interface IEnv {
  OPEN_API_KEY: string;
  GET_CALENDAR_EVENTS: string;
  ADD_EVENT_TO_CALENDAR: string;
  DELETE_EVENT_FROM_CALENDAR: string;
  API_PROMPTS_URI: string;
  API_PROMPTS_TOKEN: string;
}

const envSchema = Joi.object<IEnv>({
  OPEN_API_KEY: Joi.string().required(),
  GET_CALENDAR_EVENTS: Joi.string().required(),
  ADD_EVENT_TO_CALENDAR: Joi.string().required(),
  DELETE_EVENT_FROM_CALENDAR: Joi.string().required(),
  API_PROMPTS_URI: Joi.string().required(),
  API_PROMPTS_TOKEN: Joi.string().required(),
}).unknown(true);

const { error, value } = envSchema.validate(process.env);

if (error) throw new Error(`Invalid environment variables: ${error.message}`);

const envVars: IEnv = value;

export const envs = {
  openApiKey: envVars.OPEN_API_KEY,
  getCalendarEvents: envVars.GET_CALENDAR_EVENTS,
  adddEventToCalendar: envVars.ADD_EVENT_TO_CALENDAR,
  delteEventFromCalendar: envVars.DELETE_EVENT_FROM_CALENDAR,
  apiPromptsUri: envVars.API_PROMPTS_URI,
  apiPromptsToken: envVars.API_PROMPTS_TOKEN,
};
