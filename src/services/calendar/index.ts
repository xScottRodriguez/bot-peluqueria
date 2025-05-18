import { format, addMinutes } from "date-fns";
import { envs } from "src/config/envs";

/**
 * get calendar
 * @returns
 */
const getCurrentCalendar = async (): Promise<string> => {
  const dataCalendarApi = await fetch(envs.getCalendarEvents);
  const json: any[] = await dataCalendarApi.json();

  const list = json.reduce((prev, current) => {
    if (!current?.date) {
      return prev;
    }
    return (prev += [
      `Espacio reservado (no disponible): `,
      `Desde ${format(current?.date, "yyyy-MM-dd HH:mm")} `,
      `Hasta ${format(addMinutes(current?.date, 45), "yyyy-MM-dd HH:mm")} \n`,
    ].join(" "));
  }, "");
  return list;
};

/**
 * add to calendar
 * @param text
 * @returns
 */
const appToCalendar = async (text: string) => {
  try {
    const payload = JSON.parse(text);
    const dataApi = await fetch(envs.adddEventToCalendar, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return dataApi;
  } catch (err) {
    console.log(`error: `, err);
  }
};

export { getCurrentCalendar, appToCalendar };
