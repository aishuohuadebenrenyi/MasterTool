import os
from pymongo import MongoClient

_connection = None
_db = None


def get_db():
    global _connection, _db
    if _db is not None:
        return _db
    mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'trainer_toolbox')
    _connection = MongoClient(mongo_uri, maxPoolSize=10, minPoolSize=2)
    _db = _connection[db_name]
    return _db


def close_db():
    global _connection, _db
    if _connection:
        _connection.close()
    _connection = None
    _db = None


def get_test_db():
    import mongomock
    return mongomock.MongoClient().db
