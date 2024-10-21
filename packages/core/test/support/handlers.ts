import onetime from 'onetime'
import type { Handler } from '../../lib/handler.js'

export const getFriends = onetime(() => {
  return function getFriends() {
  }
})

export const postFriends = onetime(() => {
  return function postFriends() {
  }
})

export const getPerson = onetime(() => {
  return function getPerson() {
  }
})

export const putPerson = onetime(() => {
  return function putPerson() {
  }
})

export const headArticle = onetime(() => {
  return function headArticle() {
  }
})

export const getHtml = onetime(() => {
  return function getHtml() {
  }
})

export const bindData = onetime(() => {
  return function bindData() {
  }
})

export function parametrised(...args: unknown[]): Handler {
  return function () {
    return {
      status: 200,
      body: JSON.stringify(args),
    }
  }
}
