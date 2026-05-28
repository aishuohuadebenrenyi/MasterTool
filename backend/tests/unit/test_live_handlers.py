from bson import ObjectId

from common.auth import generate_token
from models.live_session import LiveSession
from models.participant import Participant
from functions.live import checkin as live_checkin
from functions.live import group as live_group
from functions.live import pick as live_pick
from functions.live import score as live_score
from functions.live import start as live_start


def auth_event(body):
    return {
        'headers': {'Authorization': f'Bearer {generate_token("test_user")}'},
        'body': body
    }


def test_start_live_rejects_invalid_plan_id():
    response, status = live_start.main(auth_event({'planId': 'bad-id'}), None)

    assert status == 400
    assert '方案ID格式无效' in response['message']


def test_score_rejects_invalid_participant_id():
    response, status = live_score.main(auth_event({
        'sessionId': str(ObjectId()),
        'participantId': 'bad-id',
        'score': 1
    }), None)

    assert status == 400
    assert '参与者ID格式无效' in response['message']


def test_score_rejects_non_numeric_score():
    response, status = live_score.main(auth_event({
        'sessionId': str(ObjectId()),
        'participantId': str(ObjectId()),
        'score': 'abc'
    }), None)

    assert status == 400
    assert '分数必须是数字' in response['message']


def test_group_create_returns_groups_payload(monkeypatch, mock_db):
    monkeypatch.setattr(live_group, 'get_db', lambda: mock_db)
    session = LiveSession.create('test_user', {'planId': str(ObjectId()), 'planName': '测试'})
    mock_db.live_sessions.insert_one(session)
    session_id = str(session['_id'])
    for index in range(4):
        participant = Participant.create({
            'sessionId': session_id,
            'openid': f'openid_{index}',
            'name': f'学员{index + 1}',
            'checkedIn': True
        })
        mock_db.participants.insert_one(participant)

    response = live_group.main(auth_event({
        'sessionId': session_id,
        'action': 'create',
        'groupCount': 2
    }), None)

    groups = response['data']['groups']
    assert len(groups) == 2
    assert sum(len(group['members']) for group in groups) == 4
    assert sum(len(group['memberNames']) for group in groups) == 4
    assert all(group['memberDetails'] for group in groups)


def test_checkin_rejects_duplicate_name_in_same_session(monkeypatch, mock_db):
    monkeypatch.setattr(live_checkin, 'get_db', lambda: mock_db)
    session = LiveSession.create('test_user', {'planId': str(ObjectId()), 'planName': '测试'})
    mock_db.live_sessions.insert_one(session)
    session_id = str(session['_id'])

    first = live_checkin.main({
        'body': {
            'sessionId': session_id,
            'openid': 'openid_1',
            'name': ' 张三 '
        }
    }, None)

    assert first['data']['name'] == '张三'

    response, status = live_checkin.main({
        'body': {
            'sessionId': session_id,
            'openid': 'openid_2',
            'name': '张三'
        }
    }, None)

    assert status == 400
    assert response['code'] == 3002
    assert response['message'] == '该姓名已签到，请勿重复签到'


def test_score_updates_group_score(monkeypatch, mock_db):
    monkeypatch.setattr(live_score, 'get_db', lambda: mock_db)
    session = LiveSession.create('test_user', {'planId': str(ObjectId()), 'planName': '测试'})
    session['groups'] = [{'groupId': 'group_1', 'groupName': '第1组', 'members': [], 'score': 0}]
    mock_db.live_sessions.insert_one(session)
    session_id = str(session['_id'])

    response = live_score.main(auth_event({
        'sessionId': session_id,
        'groupId': 'group_1',
        'score': 3
    }), None)

    updated = mock_db.live_sessions.find_one({'_id': session['_id']})
    assert response['data'] == {'groupId': 'group_1', 'score': 3}
    assert updated['groups'][0]['score'] == 3
    assert updated['scores']['group_1'] == 3


def test_random_pick_respects_exclude_ids(monkeypatch, mock_db):
    monkeypatch.setattr(live_pick, 'get_db', lambda: mock_db)
    session = LiveSession.create('test_user', {'planId': str(ObjectId()), 'planName': '测试'})
    mock_db.live_sessions.insert_one(session)
    session_id = str(session['_id'])
    first = Participant.create({
        'sessionId': session_id,
        'openid': 'openid_1',
        'name': '学员1',
        'checkedIn': True
    })
    second = Participant.create({
        'sessionId': session_id,
        'openid': 'openid_2',
        'name': '学员2',
        'checkedIn': True
    })
    mock_db.participants.insert_many([first, second])

    response = live_pick.main(auth_event({
        'sessionId': session_id,
        'excludeIds': [str(first['_id'])]
    }), None)

    assert response['data']['id'] == str(second['_id'])
