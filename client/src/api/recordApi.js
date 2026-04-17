import axios from 'axios'

const recordApi = axios.create({
  baseURL: 'http://localhost:4002/api',
})

export default recordApi
