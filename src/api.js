import { updateApi } from "../api-urls";
import { axiosClient } from "./axios-client";

export const updateGameDataApi = async (data) => {
  try {
    const response = await axiosClient.post(updateApi, data);
    console.log("Response: ", response);
  } catch (error) {}
  return defaultResponse;
};
