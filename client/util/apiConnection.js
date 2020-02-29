import axios from 'axios'
import { getHeaders } from 'Utilities/mockHeaders'
import { basePath, inProduction } from 'Utilities/common'

/**
 * ApiConnection simplifies api usage
 */

// To just set basepath
const getAxios = axios.create({ baseURL: `${basePath}api` })

// To set headers as well
export const callApi = async (url, method = 'get', data, settings) => {
  const token = localStorage.getItem('token')
  let headers = {}
  if (token) headers['x-access-token'] = token
  const adminLoggedInAs = localStorage.getItem('adminLoggedInAs')

  if (adminLoggedInAs) headers['x-admin-logged-in-as'] = adminLoggedInAs
  if (!inProduction) headers = { ...headers, ...getHeaders() }

  try {
    const response = await getAxios({
      method,
      url,
      data,
      headers,
      ...settings,
    })

    return response
  } catch (err) {
    console.log('Error happened', err)
    throw err
  }
}

// To automatically create requests and redux events dispatch this action
export default (route, prefix, method = 'get', data, query) => (
  {
    type: `${prefix}_ATTEMPT`,
    requestSettings: {
      route,
      method,
      data,
      prefix,
      query,
    },
  }
)

/**
 * This is a redux middleware used for tracking api calls
 */

export const handleRequest = store => next => async (action) => {
  next(action)
  const { requestSettings } = action
  if (requestSettings) {
    const {
      route, method, data, prefix, query,
    } = requestSettings
    try {
      const res = await callApi(route, method, data)
      store.dispatch({ type: `${prefix}_SUCCESS`, response: res.data, query })
    } catch (err) {
      if (err.message.toLowerCase() === 'network error') {
        return window.location.reload(true)
      }
      store.dispatch({ type: `${prefix}_FAILURE`, response: err, query })
    }
  }
}
