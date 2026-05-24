import pytest
from models.review import Review


class TestReview:
    def test_create_review(self):
        data = {
            'planId': 'plan_001',
            'planName': '测试方案',
            'sessionId': 'session_001',
            'method': Review.METHOD_ORID
        }
        review = Review.create('user_001', data)
        assert review['userId'] == 'user_001'
        assert review['planId'] == 'plan_001'
        assert review['method'] == Review.METHOD_ORID
        assert review['completedAt'] is None

    def test_to_dict(self):
        data = {'planId': 'plan_001', 'planName': '测试'}
        review = Review.create('user_001', data)
        result = Review.to_dict(review)
        assert 'id' in result
        assert '_id' not in result
        assert result['planName'] == '测试'

    def test_to_dict_none(self):
        assert Review.to_dict(None) is None

    def test_review_methods(self):
        assert Review.METHOD_ORID == 'orid'
        assert Review.METHOD_FOUR_F == '4f'
        assert Review.METHOD_SSC == 'ssc'
