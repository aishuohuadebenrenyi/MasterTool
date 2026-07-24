const planActions = require('./plan-actions')
const activityActions = require('./activity-actions')

module.exports = {
  ...planActions,
  ...activityActions
}
