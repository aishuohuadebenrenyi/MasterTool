import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from mongomock import MongoClient
from common.database import close_db


@pytest.fixture
def mock_db():
    client = MongoClient()
    db = client['trainer_toolbox_test']
    yield db
    client.close()


@pytest.fixture
def auth_token():
    from common.auth import generate_token
    return generate_token('test_user_001')


@pytest.fixture
def auth_headers(auth_token):
    return {'Authorization': f'Bearer {auth_token}'}


@pytest.fixture
def sample_plan_data():
    return {
        'name': '测试方案',
        'type': 'improv_training',
        'people': 20,
        'clientName': '测试客户',
        'phases': [
            {'name': '破冰环节', 'duration': 15, 'activities': []},
            {'name': '核心环节', 'duration': 45, 'activities': []}
        ],
        'date': '2026-05-23',
        'duration': 60
    }


@pytest.fixture
def sample_activity_data():
    return {
        'name': '测试活动',
        'category': 'icebreaker',
        'duration': 15,
        'description': '这是一个测试活动',
        'rules': '规则说明',
        'materials': ['白板', '便利贴']
    }
