import { notEmptyObj } from "./utils";
const stringOne = ({ sdkName, version, baseUrl }) => {
  return `
import axios from "axios";

export default class ${sdkName} {
  constructor() {
    this.version = "${version}";
    this.name = "${sdkName}";
    this.configs = {
      baseURL: "${baseUrl}",
      headers: {
        Authorization: ${sdkName}.getAuthorizationHeader(),
    `;
};
function stringTwo({ key, value, sdkName }) {
  return `    ${key}: "${value}",
    },
      ...${sdkName}.configs
    };
      `;
}
const stringThree = ({ sdkName }) => {
  return `
  const instance = axios.create({
    ...this.configs
  });
  // get authorization on every request
  instance.interceptors.request.use(
    config => {
      config.headers.Authorization = ${sdkName}.getAuthorizationHeader();
      return config;
    },
    error => {
      return Promise.reject(error);
    }
  );
  this.axiosInstance = instance;
}

fetchApi({
  resolve,
  isFormData,
  method,
  _data,
  _url,
  _params = {},
  _pathParams = [],
  headerConfigs = {}
}) {
  return new Promise(async resolve => {
    const obj = {
      error: null,
      data: null
    };
    let data = _data;
    if (isFormData) {
      const formdata = new FormData();
      Object.entries(_data).forEach(arr => {
        formdata.append(arr[0], arr[1]);
      });
      data = formdata;
    }
    let url = _url;
    if (Object.keys(_pathParams).length) {
      Object.entries(_pathParams).forEach(
        arr => (url = url.replace("{" + arr[0] + "}", arr[1]))
      );
    }
    try {
      const resObj = await this.axiosInstance({
        url,
        method,
        data,
        ...(Object.keys(_params).length ? { params: _params } : {}),
        ...(isFormData
          ? {
              headers: {
                "Content-Type": "multipart/form-data"
              }
            }
          : {})
      });
      obj.data = resObj.data;
      resolve(obj);
    } catch (error) {
      if (error.response) {
        obj.error = error.response.data;
      } else if (error.request) {
        obj.error = error.request;
      } else {
        obj.error = error.message;
      }
      resolve(obj);
    }
  });
}
    `;
};
function functionSignature({
  hasPathParams,
  operationName,
  url,
  requestMethod,
  isFormData
}) {
  return `
  ${operationName}({ _params,${hasPathParams ? "_pathParams," : ""}${
    requestMethod === "PUT" || requestMethod === "POST" ? "..._data" : ""
  } }) {
    return this.fetchApi({
      method: "${requestMethod}",${
    isFormData ? "\n      isFormData: true," : ""
  }
      _url: '${url}',${
    requestMethod === "PUT" || requestMethod === "POST" ? "\n      _data," : ""
  }
      _params,${hasPathParams ? "\n      _pathParams," : ""}
    });
  }
  `;
}
const endString = `
}
`;
export { stringOne, stringTwo, stringThree, functionSignature, endString };
