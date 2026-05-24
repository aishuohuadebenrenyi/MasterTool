import pytest
from models.activity import Activity


class TestActivityFlow:
    def test_create_and_retrieve(self, mock_db, sample_activity_data):
        activity = Activity.create('test_user', sample_activity_data)
        mock_db.activities.insert_one(activity)

        found = mock_db.activities.find_one({'userId': 'test_user'})
        assert found is not None
        assert found['name'] == '测试活动'

    def test_update_activity(self, mock_db, sample_activity_data):
        activity = Activity.create('test_user', sample_activity_data)
        mock_db.activities.insert_one(activity)

        mock_db.activities.update_one(
            {'_id': activity['_id']},
            {'$set': {'name': '更新后的活动', 'duration': 30}}
        )

        updated = mock_db.activities.find_one({'_id': activity['_id']})
        assert updated['name'] == '更新后的活动'
        assert updated['duration'] == 30

    def test_delete_activity(self, mock_db, sample_activity_data):
        activity = Activity.create('test_user', sample_activity_data)
        mock_db.activities.insert_one(activity)

        mock_db.activities.delete_one({'_id': activity['_id']})
        found = mock_db.activities.find_one({'_id': activity['_id']})
        assert found is None

    def test_toggle_favorite(self, mock_db, sample_activity_data):
        activity = Activity.create('test_user', sample_activity_data)
        mock_db.activities.insert_one(activity)

        assert activity['isFavorite'] is False

        mock_db.activities.update_one(
            {'_id': activity['_id']},
            {'$set': {'isFavorite': True}}
        )

        updated = mock_db.activities.find_one({'_id': activity['_id']})
        assert updated['isFavorite'] is True

    def test_filter_by_category(self, mock_db):
        for cat in ['icebreaker', 'energy', 'collaboration']:
            data = {'name': f'活动_{cat}', 'category': cat}
            activity = Activity.create('test_user', data)
            mock_db.activities.insert_one(activity)

        icebreakers = list(mock_db.activities.find({'category': 'icebreaker'}))
        assert len(icebreakers) == 1
        assert icebreakers[0]['category'] == 'icebreaker'
