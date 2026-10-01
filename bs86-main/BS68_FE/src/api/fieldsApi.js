import axiosClient from "./axiosClient";

function unwrapResponse(response) {
  return response?.data?.data ?? response.data;
}

export const fieldsApi = {
  // GET /api/public/fields
  getPublicFields() {
    return axiosClient.get("/api/public/fields").then(unwrapResponse);
  },

  // GET /api/public/fields/{slug}
  getPublicFieldDetail(slug) {
    return axiosClient.get(`/api/public/fields/${slug}`).then(unwrapResponse);
  },

  // GET /api/public/fields/map
  getMapMarkers(params) {
    return axiosClient.get("/api/public/fields/map", { params }).then(unwrapResponse);
  },

  // POST /api/owner/fields
  createField(body) {
    return axiosClient.post("/api/owner/fields", body).then(unwrapResponse);
  },
};
