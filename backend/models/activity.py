from datetime import datetime
from bson import ObjectId


class Activity:
    CATEGORY_ICEBREAKER = 'icebreaker'
    CATEGORY_ENERGY = 'energy'
    CATEGORY_COLLABORATION = 'collaboration'
    CATEGORY_CREATIVITY = 'creativity'
    CATEGORY_REFLECTION = 'reflection'
    CATEGORY_CUSTOM = 'custom'

    DEFAULT_SCENE = '通用'
    SCENE_LABELS = {
        CATEGORY_ICEBREAKER: '破冰',
        CATEGORY_ENERGY: '能量',
        CATEGORY_COLLABORATION: '协作沟通',
        CATEGORY_CREATIVITY: '创新思维',
        CATEGORY_REFLECTION: '反思',
        CATEGORY_CUSTOM: '自定义',
        '团队融合': '团队融合',
        '协作沟通': '协作沟通',
        '创新思维': '创新思维',
        '领导力': '领导力',
        '通用': '通用',
        '情绪管理': '情绪管理'
    }
    SCENE_CODES_BY_LABEL = {
        '破冰': CATEGORY_ICEBREAKER,
        '能量': CATEGORY_ENERGY,
        '协作': CATEGORY_COLLABORATION,
        '协作沟通': CATEGORY_COLLABORATION,
        '创意': CATEGORY_CREATIVITY,
        '创新思维': CATEGORY_CREATIVITY,
        '反思': CATEGORY_REFLECTION,
        '自定义': CATEGORY_CUSTOM
    }

    @staticmethod
    def normalize_scene_value(value):
        if not value:
            return Activity.DEFAULT_SCENE
        text = str(value)
        return Activity.SCENE_LABELS.get(text, text)

    @staticmethod
    def normalize_scenes(data):
        scenes = data.get('scenes')
        if isinstance(scenes, list):
            result = []
            for item in scenes:
                if item:
                    label = Activity.normalize_scene_value(item)
                    if label not in result:
                        result.append(label)
            if result:
                return result
        scene = data.get('scene') or data.get('category')
        if scene:
            return [Activity.normalize_scene_value(scene)]
        return [Activity.DEFAULT_SCENE]

    @staticmethod
    def scene_query_values(value):
        label = Activity.normalize_scene_value(value)
        values = {label}
        code = Activity.SCENE_CODES_BY_LABEL.get(label)
        if code:
            values.add(code)
        if value:
            values.add(str(value))
        return list(values)

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
    def difficulty_to_intensity(difficulty):
        mapping = {
            '简单': 'low',
            'low': 'low',
            'easy': 'low',
            '中等': 'medium',
            'medium': 'medium',
            '困难': 'high',
            'hard': 'high',
            'high': 'high'
        }
        return mapping.get(str(difficulty or ''), 'medium')

    @staticmethod
    def parse_people_range(people):
        text = str(people or '')
        import re
        numbers = [int(n) for n in re.findall(r'\d+', text)]
        if len(numbers) >= 2:
            return numbers[0], numbers[1]
        if len(numbers) == 1:
            return 1, numbers[0]
        return 0, 0

    @staticmethod
    def create(user_id, data):
        now = datetime.utcnow()
        difficulty = data.get('difficulty') or data.get('intensity') or '中等'
        review_guide = data.get('reviewGuide') or data.get('reviewQuestions') or data.get('leaderTips') or ''
        scenes = Activity.normalize_scenes(data)
        category = Activity.normalize_scene_value(data.get('category') or scenes[0])
        people = Activity.normalize_people(data)
        min_people, max_people = Activity.parse_people_range(people)
        rules = data.get('rules') or data.get('description', '')
        tips = data.get('tips') or data.get('leaderTips', '')
        return {
            '_id': ObjectId(),
            'userId': user_id,
            'name': data.get('name', ''),
            'scenes': scenes,
            'category': category,
            'difficulty': difficulty,
            'intensity': data.get('intensity') or Activity.difficulty_to_intensity(difficulty),
            'people': people,
            'participants': people,
            'minPeople': min_people,
            'maxPeople': max_people,
            'duration': int(data.get('duration', 0) or 0),
            'learningGoal': data.get('learningGoal') or data.get('objective') or data.get('description', ''),
            'objective': data.get('objective') or data.get('learningGoal') or data.get('description', ''),
            'materials': data.get('materials', []),
            'steps': Activity.normalize_steps(data),
            'rules': rules,
            'tips': tips,
            'leaderTips': data.get('leaderTips') or tips,
            'reviewQuestions': data.get('reviewQuestions') or review_guide,
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
        category = Activity.normalize_scene_value(result.get('category') or (result['scenes'][0] if result['scenes'] else Activity.DEFAULT_SCENE))
        result['category'] = category
        result['scene'] = result['category']
        result['people'] = result.get('people') or Activity.normalize_people(result)
        result['participants'] = result.get('participants') or result['people']
        min_people, max_people = Activity.parse_people_range(result['people'])
        result['minPeople'] = result.get('minPeople') or min_people
        result['maxPeople'] = result.get('maxPeople') or max_people
        result['intensity'] = result.get('intensity') or Activity.difficulty_to_intensity(result.get('difficulty'))
        result['description'] = result.get('learningGoal', result.get('description', ''))
        result['objective'] = result.get('learningGoal', '')
        steps = result.get('steps', [])
        result['rules'] = result.get('rules') or ('\n'.join(steps) if isinstance(steps, list) else '')
        result['reviewQuestions'] = result.get('reviewQuestions') or result.get('reviewGuide', '')
        tips = result.get('tips', '')
        result['leaderTips'] = result.get('leaderTips') or ('\n'.join(tips) if isinstance(tips, list) else tips) or result.get('reviewGuide', '')
        if 'createdAt' in result:
            result['createdAt'] = result['createdAt'].isoformat() if isinstance(result['createdAt'], datetime) else result['createdAt']
        if 'updatedAt' in result:
            result['updatedAt'] = result['updatedAt'].isoformat() if isinstance(result['updatedAt'], datetime) else result['updatedAt']
        return result
