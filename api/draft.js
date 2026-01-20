import { get, post, del } from './request'

export const getDraftList = () => {
  return get('/api/draft/list')
}

export const addToDraft = (data) => {
  return post('/api/draft/add', data)
}

export const updateDraftItem = (data) => {
  return post('/api/draft/update', data)
}

export const deleteDraftItem = (id) => {
  return del(`/api/draft/delete/${id}`)
}
