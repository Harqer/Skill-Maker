import os
import sys
from redis import Redis
from rq import Worker, Queue, Connection


redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
conn = Redis.from_url(redis_url)

if __name__ == '__main__':
    print("Starting RQ Worker for Skill-Maker...")
    with Connection(conn):
        worker = Worker(['default'])
        worker.work()
