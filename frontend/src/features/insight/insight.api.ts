import { api } from '../../lib/api'
import type {
  InsightEchoPageResult,
  InsightRangeInput,
  InsightSummary
} from './insight.types'

function buildRangeQuery(params: InsightRangeInput) {
  const searchParams = new URLSearchParams()
  searchParams.set('rangeType', params.rangeType)

  if (params.rangeType === 'custom') {
    if (params.startDate) {
      searchParams.set('startDate', params.startDate)
    }
    if (params.endDate) {
      searchParams.set('endDate', params.endDate)
    }
  }

  return searchParams.toString()
}

export function getInsightSummary(params: InsightRangeInput) {
  return api.get<InsightSummary>(`/insights/summary?${buildRangeQuery(params)}`)
}

export function getInsightEchoes(
  params: InsightRangeInput & {
    page?: number
    pageSize?: number
  }
) {
  const searchParams = new URLSearchParams(buildRangeQuery(params))

  if (params.page) {
    searchParams.set('page', String(params.page))
  }
  if (params.pageSize) {
    searchParams.set('pageSize', String(params.pageSize))
  }

  return api.get<InsightEchoPageResult>(`/insights/echoes?${searchParams.toString()}`)
}
