const normalizeDate = (dateString: string) => {
  const [date, time] = dateString.split("T");
  const [finalTime] = time.split(":");

  return `${date}T${finalTime}`;
};

export { normalizeDate };
