from bson import ObjectId

from common.auth import generate_token
from models.plan import Plan
from functions.plan import save_template as plan_save_template


def auth_event(plan_id):
    return {
        'headers': {'Authorization': f'Bearer {generate_token("test_user")}'},
        'pathParameters': {'planId': plan_id}
    }


def test_save_plan_as_personal_template(monkeypatch, mock_db):
    monkeypatch.setattr(plan_save_template, 'get_db', lambda: mock_db)
    plan = Plan.create('test_user', {
        'name': '企业培训方案',
        'type': 'corporate',
        'people': 20,
        'phases': [{'name': '开场', 'duration': 10}]
    })
    mock_db.plans.insert_one(plan)

    response = plan_save_template.main(auth_event(str(plan['_id'])), None)

    data = response['data']
    assert data['name'] == '企业培训方案模板'
    assert data['source'] == 'personal_template'
    assert data['isPersonalTemplate'] is True
    assert data['templateSourcePlanId'] == str(plan['_id'])


def test_save_template_rejects_missing_plan(monkeypatch, mock_db):
    monkeypatch.setattr(plan_save_template, 'get_db', lambda: mock_db)

    response, status = plan_save_template.main(auth_event(str(ObjectId())), None)

    assert status == 404
    assert response['message'] == '方案不存在'
