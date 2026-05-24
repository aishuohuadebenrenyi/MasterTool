import json
import re

from functions.plan.create import main as plan_create
from functions.plan.update import main as plan_update
from functions.plan.delete import main as plan_delete
from functions.plan.list import main as plan_list
from functions.plan.detail import main as plan_detail
from functions.plan.confirm import main as plan_confirm

from functions.activity.create import main as activity_create
from functions.activity.update import main as activity_update
from functions.activity.delete import main as activity_delete
from functions.activity.list import main as activity_list
from functions.activity.detail import main as activity_detail
from functions.activity.favorite import main as activity_favorite

from functions.live.start import main as live_start
from functions.live.end import main as live_end
from functions.live.checkin import main as live_checkin
from functions.live.checkin_list import main as live_checkin_list
from functions.live.group import main as live_group
from functions.live.score import main as live_score
from functions.live.pick import main as live_pick

from functions.review.start import main as review_start
from functions.review.save import main as review_save
from functions.review.detail import main as review_detail
from functions.review.list import main as review_list

from functions.feedback.submit import main as feedback_submit
from functions.feedback.stats import main as feedback_stats
from functions.feedback.list import main as feedback_list

from functions.user.login import main as user_login
from functions.user.profile import main as user_profile
from functions.user.feedback import main as user_feedback
from functions.user.stats import main as user_stats

from functions.note.list import main as note_list
from functions.note.save import main as note_save

ROUTES = [
    (r'^/user/login$', 'POST', user_login),
    (r'^/user/profile$', 'GET', user_profile),
    (r'^/user/profile$', 'POST', user_profile),
    (r'^/user/profile$', 'PUT', user_profile),
    (r'^/user/feedback$', 'POST', user_feedback),
    (r'^/user/stats$', 'GET', user_stats),

    (r'^/plan/create$', 'POST', plan_create),
    (r'^/plan/update/([^/]+)$', 'PUT', plan_update),
    (r'^/plan/delete/([^/]+)$', 'DELETE', plan_delete),
    (r'^/plan/list$', 'GET', plan_list),
    (r'^/plan/detail/([^/]+)$', 'GET', plan_detail),
    (r'^/plan/confirm/([^/]+)$', 'POST', plan_confirm),

    (r'^/activity/create$', 'POST', activity_create),
    (r'^/activity/update/([^/]+)$', 'PUT', activity_update),
    (r'^/activity/delete/([^/]+)$', 'DELETE', activity_delete),
    (r'^/activity/list$', 'GET', activity_list),
    (r'^/activity/detail/([^/]+)$', 'GET', activity_detail),
    (r'^/activity/favorite/([^/]+)$', 'POST', activity_favorite),

    (r'^/live/start$', 'POST', live_start),
    (r'^/live/end$', 'POST', live_end),
    (r'^/live/checkin$', 'POST', live_checkin),
    (r'^/live/checkin-list$', 'GET', live_checkin_list),
    (r'^/live/checkin/list$', 'GET', live_checkin_list),
    (r'^/live/group$', 'POST', live_group),
    (r'^/live/score$', 'POST', live_score),
    (r'^/live/pick$', 'POST', live_pick),

    (r'^/review/start$', 'POST', review_start),
    (r'^/review/save/([^/]+)$', 'POST', review_save),
    (r'^/review/detail/([^/]+)$', 'GET', review_detail),
    (r'^/review/list$', 'GET', review_list),

    (r'^/feedback/submit$', 'POST', feedback_submit),
    (r'^/feedback/stats$', 'GET', feedback_stats),
    (r'^/feedback/list$', 'GET', feedback_list),

    (r'^/note/list$', 'GET', note_list),
    (r'^/note/save$', 'POST', note_save),
]


def dispatch(event, context):
    path = event.get('path', '')
    http_method = event.get('httpMethod', 'GET')

    for pattern, method, handler in ROUTES:
        if method != http_method:
            continue
        match = re.match(pattern, path)
        if match:
            path_params = {}
            if match.groups():
                param_name = 'planId'
                if '/activity/' in path:
                    param_name = 'activityId'
                elif '/review/' in path:
                    param_name = 'reviewId'
                path_params = {param_name: match.group(1)}
            event.setdefault('pathParameters', {}).update(path_params)
            return handler(event, context)

    return {
        'statusCode': 404,
        'body': json.dumps({'code': 404, 'message': 'Not Found'})
    }


def main_handler(event, context):
    return dispatch(event, context)
