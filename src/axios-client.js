import axios from "axios";

// FIXME: Change base url
let baseTralkUrl = "https://e1bd-14-97-1-234.ngrok.io/";

if (baseTralkUrl && baseTralkUrl.endsWith("/")) {
  baseTralkUrl = baseTralkUrl.substring(0, baseTralkUrl.length - 1);
}

export const axiosClient = axios.create({
  baseURL: `${baseTralkUrl}/`,
  headers: {
    "Content-Type": "application/json",
  },
});
