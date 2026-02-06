import buildPlanPromptTemplate from './planPrompt'

function buildPlanPrompt(prdJsonContent) {
  if (!prdJsonContent) throw new Error('prdJsonContent is required')
  return buildPlanPromptTemplate(prdJsonContent)
}

export default buildPlanPrompt
