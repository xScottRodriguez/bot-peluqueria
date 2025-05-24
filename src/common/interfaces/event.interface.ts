interface IEvent {
  date: string;
  name: string;
  "phone number": string;
}

interface IEventCalendar {
  client: string;
  service: string;
  startDate: string;
  endDate: string;
  phoneNumber: string;
}

export { IEvent, IEventCalendar };
