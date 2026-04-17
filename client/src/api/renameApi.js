import axios from 'axios'

const renameApi = axios.create({
  baseURL: 'http://localhost:4002/api/recordings/rename-video',
})

export default renameApi
