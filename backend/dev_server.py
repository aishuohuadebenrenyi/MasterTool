import sys
import os
import json
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from common.auth import verify_token
from common.response import success, error
from common.errors import ErrorCode

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

app = Flask(__name__)
CORS(app)


def build_event():
    # 本地 Flask 调试统一拼成和云函数一致的 event 结构，
    # 这样 functions/* 下的逻辑可以同时复用于本地开发和 serverless 部署。
    headers = dict(request.headers)
    body = request.get_json(silent=True) or {}
    query = dict(request.args)
    path_params = request.view_args or {}
    return {
        'headers': headers,
        'body': body,
        'queryStringParameters': query,
        'pathParameters': path_params,
        'httpMethod': request.method,
        'path': request.path
    }


def handle_response(result):
    # 本地开发允许 handler 直接返回 (dict, status_code) 或普通 dict，这里统一转成 Flask Response。
    if isinstance(result, tuple):
        data, status_code = result
        if isinstance(data, dict):
            return jsonify(data), status_code
        return data, status_code
    if isinstance(result, dict):
        return jsonify(result)
    return result


@app.route('/', methods=['GET'])
def api_root():
    return handle_response(success({
        'status': 'ok',
        'service': 'ImprovTool backend',
        'health': '/health'
    }))


@app.route('/health', methods=['GET'])
def api_health():
    return handle_response(success({
        'status': 'ok',
        'service': 'ImprovTool backend'
    }))


@app.route('/user/login', methods=['POST'])
def api_user_login():
    event = build_event()
    return handle_response(user_login(event, None))


@app.route('/user/profile', methods=['GET', 'POST', 'PUT'])
def api_user_profile():
    event = build_event()
    return handle_response(user_profile(event, None))


@app.route('/user/stats', methods=['GET'])
def api_user_stats():
    event = build_event()
    return handle_response(user_stats(event, None))


@app.route('/user/feedback', methods=['POST'])
def api_user_feedback():
    event = build_event()
    return handle_response(user_feedback(event, None))


@app.route('/plan/create', methods=['POST'])
def api_plan_create():
    event = build_event()
    return handle_response(plan_create(event, None))


@app.route('/plan/update/<planId>', methods=['PUT'])
def api_plan_update(planId):
    event = build_event()
    event['pathParameters'] = {'planId': planId}
    return handle_response(plan_update(event, None))


@app.route('/plan/delete/<planId>', methods=['DELETE'])
def api_plan_delete(planId):
    event = build_event()
    event['pathParameters'] = {'planId': planId}
    return handle_response(plan_delete(event, None))


@app.route('/plan/list', methods=['GET'])
def api_plan_list():
    event = build_event()
    return handle_response(plan_list(event, None))


@app.route('/plan/detail/<planId>', methods=['GET'])
def api_plan_detail(planId):
    event = build_event()
    event['pathParameters'] = {'planId': planId}
    return handle_response(plan_detail(event, None))


@app.route('/plan/confirm/<planId>', methods=['POST'])
def api_plan_confirm(planId):
    event = build_event()
    event['pathParameters'] = {'planId': planId}
    return handle_response(plan_confirm(event, None))


@app.route('/activity/create', methods=['POST'])
def api_activity_create():
    event = build_event()
    return handle_response(activity_create(event, None))


@app.route('/activity/update/<activityId>', methods=['PUT'])
def api_activity_update(activityId):
    event = build_event()
    event['pathParameters'] = {'activityId': activityId}
    return handle_response(activity_update(event, None))


@app.route('/activity/delete/<activityId>', methods=['DELETE'])
def api_activity_delete(activityId):
    event = build_event()
    event['pathParameters'] = {'activityId': activityId}
    return handle_response(activity_delete(event, None))


@app.route('/activity/list', methods=['GET'])
def api_activity_list():
    event = build_event()
    return handle_response(activity_list(event, None))


@app.route('/activity/detail/<activityId>', methods=['GET'])
def api_activity_detail(activityId):
    event = build_event()
    event['pathParameters'] = {'activityId': activityId}
    return handle_response(activity_detail(event, None))


@app.route('/activity/favorite/<activityId>', methods=['POST'])
def api_activity_favorite(activityId):
    event = build_event()
    event['pathParameters'] = {'activityId': activityId}
    return handle_response(activity_favorite(event, None))


@app.route('/live/start', methods=['POST'])
def api_live_start():
    event = build_event()
    return handle_response(live_start(event, None))


@app.route('/live/end', methods=['POST'])
def api_live_end():
    event = build_event()
    return handle_response(live_end(event, None))


@app.route('/live/checkin', methods=['POST'])
def api_live_checkin():
    event = build_event()
    return handle_response(live_checkin(event, None))


@app.route('/live/checkin-list', methods=['GET'])
def api_live_checkin_list():
    event = build_event()
    return handle_response(live_checkin_list(event, None))


@app.route('/live/checkin/list', methods=['GET'])
def api_live_checkin_list_alias():
    event = build_event()
    return handle_response(live_checkin_list(event, None))


@app.route('/live/group', methods=['POST'])
def api_live_group():
    event = build_event()
    return handle_response(live_group(event, None))


@app.route('/live/score', methods=['POST'])
def api_live_score():
    event = build_event()
    return handle_response(live_score(event, None))


@app.route('/live/pick', methods=['POST'])
def api_live_pick():
    event = build_event()
    return handle_response(live_pick(event, None))


@app.route('/review/start', methods=['POST'])
def api_review_start():
    event = build_event()
    return handle_response(review_start(event, None))


@app.route('/review/save/<reviewId>', methods=['POST'])
def api_review_save(reviewId):
    event = build_event()
    event['pathParameters'] = {'reviewId': reviewId}
    return handle_response(review_save(event, None))


@app.route('/review/detail/<reviewId>', methods=['GET'])
def api_review_detail(reviewId):
    event = build_event()
    event['pathParameters'] = {'reviewId': reviewId}
    return handle_response(review_detail(event, None))


@app.route('/review/list', methods=['GET'])
def api_review_list():
    event = build_event()
    return handle_response(review_list(event, None))


@app.route('/feedback/submit', methods=['POST'])
def api_feedback_submit():
    event = build_event()
    return handle_response(feedback_submit(event, None))


@app.route('/feedback/stats', methods=['GET'])
def api_feedback_stats():
    event = build_event()
    return handle_response(feedback_stats(event, None))


@app.route('/feedback/list', methods=['GET'])
def api_feedback_list():
    event = build_event()
    return handle_response(feedback_list(event, None))


@app.route('/note/list', methods=['GET'])
def api_note_list():
    event = build_event()
    return handle_response(note_list(event, None))


@app.route('/note/save', methods=['POST'])
def api_note_save():
    event = build_event()
    return handle_response(note_save(event, None))


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    print(f'本地开发服务器启动: http://localhost:{port}')
    print(f'API 前缀: 无（直接访问 /plan/list 等）')
    app.run(host='0.0.0.0', port=port, debug=True)
