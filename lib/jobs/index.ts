import fetch from "node-fetch";
import { JobHistory } from "next-env";

const jobsEndpoint = "https://quiet-island-86124.herokuapp.com/job-history";

export async function getJobs(): Promise<JobHistory> {
  const res = await fetch(jobsEndpoint);
  const jobHistory = await res.json();
  return jobHistory;
}
