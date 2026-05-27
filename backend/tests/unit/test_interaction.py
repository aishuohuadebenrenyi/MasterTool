from bson import ObjectId

from common.auth import generate_token
from models.live_session import LiveSession
from functions.interaction import create as interaction_create
from functions.interaction import detail as interaction_detail
from functions.interaction import submit as interaction_submit
from functions.interaction import stats as interaction_stats
from functions.interaction import update as interaction_update


def auth_event(body):
    return {
        'headers': {'Authorization': f'Bearer {generate_token("test_user")}'},
        'body': body
    }


def query_event(params, authed=False):
    event = {'queryStringParameters': params}
    if authed:
        event['headers'] = {'Authorization': f'Bearer {generate_token("test_user")}'}
    return event


def patch_db(monkeypatch, mock_db):
    monkeypatch.setattr(interaction_create, 'get_db', lambda: mock_db)
    monkeypatch.setattr(interaction_detail, 'get_db', lambda: mock_db)
    monkeypatch.setattr(interaction_submit, 'get_db', lambda: mock_db)
    monkeypatch.setattr(interaction_stats, 'get_db', lambda: mock_db)
    monkeypatch.setattr(interaction_update, 'get_db', lambda: mock_db)


def create_session(mock_db):
    session = LiveSession.create('test_user', {'planId': str(ObjectId()), 'planName': '测试'})
    mock_db.live_sessions.insert_one(session)
    return str(session['_id'])


def test_interaction_create_detail_submit_and_stats(monkeypatch, mock_db):
    patch_db(monkeypatch, mock_db)
    session_id = create_session(mock_db)

    created = interaction_create.main(auth_event({
        'sessionId': session_id,
        'type': 'wordcloud'
    }), None)
    interaction = created['data']

    detail = interaction_detail.main(query_event({
        'interactionId': interaction['interactionId'],
        'code': interaction['joinCode']
    }), None)
    assert detail['data']['type'] == 'wordcloud'

    submitted = interaction_submit.main({
        'body': {
            'interactionId': interaction['interactionId'],
            'code': interaction['joinCode'],
            'content': '协作'
        }
    }, None)
    assert submitted['data']['submitted'] is True

    stats = interaction_stats.main(query_event({
        'interactionId': interaction['interactionId']
    }, authed=True), None)
    assert stats['data']['wordcloud'] == [{'word': '协作', 'count': 1}]


def test_vote_options_can_be_updated(monkeypatch, mock_db):
    patch_db(monkeypatch, mock_db)
    session_id = create_session(mock_db)
    created = interaction_create.main(auth_event({
        'sessionId': session_id,
        'type': 'vote'
    }), None)
    interaction = created['data']

    response = interaction_update.main(auth_event({
        'interactionId': interaction['interactionId'],
        'options': [
            {'label': 'A', 'count': 1},
            {'label': 'B', 'count': 0},
            {'label': 'C', 'count': 0}
        ]
    }), None)

    assert len(response['data']['options']) == 3
    assert response['data']['options'][0]['count'] == 1
