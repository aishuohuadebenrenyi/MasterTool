from datetime import datetime
from bson import ObjectId


class Activity:
    DEFAULT_SCENE = '通用'

    @staticmethod
    def normalize_scenes(data):
        scenes = data.get('scenes')
        if isinstance(scenes, list):
            result = [str(item) for item in scenes if item]
            if result:
                return result
        scene = data.get('scene') or data.get('category')
        if scene:
            return [str(scene)]
        return [Activity.DEFAULT_SCENE]

    @staticmethod
    def normalize_people(data):
        people = data.get('people')
        if people:
            return str(people)
        min_people = data.get('minPeople')
        max_people = data.get('maxPeople')
        if min_people and max_people:
            return f'{min_people}-{max_people}人'
        if max_people:
            return f'1-{max_people}人'
        return ''

    @staticmethod
    def normalize_steps(data):
        steps = data.get('steps', [])
        if isinstance(steps, list):
            return steps
        rules = data.get('rules')
        if isinstance(rules, str) and rules:
            return [rules]
        return []

    @staticmethod
    def create(user_id, data):
        now = datetime.utcnow()
        difficulty = data.get('difficulty') or data.get('intensity') or '中等'
        review_guide = data.get('reviewGuide') or data.get('reviewQuestions') or data.get('leaderTips') or ''
        return {
            '_id': ObjectId(),
            'userId': user_id,
            'name': data.get('name', ''),
            'scenes': Activity.normalize_scenes(data),
            'category': data.get('category', Activity.normalize_scenes(data)[0]),
            'difficulty': difficulty,
            'people': Activity.normalize_people(data),
            'duration': int(data.get('duration', 0) or 0),
            'learningGoal': data.get('learningGoal') or data.get('objective') or data.get('description', ''),
            'materials': data.get('materials', []),
            'steps': Activity.normalize_steps(data),
            'tips': data.get('tips', []),
            'reviewGuide': review_guide,
            'isFavorite': bool(data.get('isFavorite', False)),
            'isPinned': bool(data.get('isPinned', False)),
            'isHighRisk': bool(data.get('isHighRisk', False) or data.get('riskLevel') in {'高', 'high'}),
            'createdBy': data.get('createdBy') or user_id,
            'isCustom': bool(data.get('isCustom', True)),
            'source': data.get('source', 'custom' if data.get('isCustom', True) else 'system'),
            'createdAt': now,
            'updatedAt': now
        }

    @staticmethod
    def to_dict(activity):
        if activity is None:
            return None
        result = dict(activity)
        result['id'] = str(result.pop('_id', ''))
        result['scenes'] = Activity.normalize_scenes(result)
        result['category'] = result['scenes'][0] if result['scenes'] else Activity.DEFAULT_SCENE
        result['scene'] = result['category']
        result['people'] = result.get('people') or Activity.normalize_people(result)
        result['description'] = result.get('learningGoal', result.get('description', ''))
        result['objective'] = result.get('learningGoal', '')
        result['leaderTips'] = result.get('reviewGuide', '')
        if 'createdAt' in result:
            result['createdAt'] = result['createdAt'].isoformat() if isinstance(result['createdAt'], datetime) else result['createdAt']
        if 'updatedAt' in result:
            result['updatedAt'] = result['updatedAt'].isoformat() if isinstance(result['updatedAt'], datetime) else result['updatedAt']
        return result
