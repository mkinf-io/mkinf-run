import traceback

from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from gotrue.errors import AuthApiError

from utils.db_client import get_db, DBClient

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def check_auth(token: str = Depends(oauth2_scheme), db: DBClient | None = Depends(get_db)):
    try:
        if db is None: raise HTTPException(status_code=500, detail="Server Error")
        if token is None: raise HTTPException(status_code=401, detail="Unauthorized")
        is_key = len(token) < 36
        if is_key: # is a hub key
            res = (db.table("hub_keys")
                   .select()
                   .eq("value", token)
                   .execute())
            if res is None or len(res.data) == 0: raise HTTPException(status_code=401, detail="Unauthorized")
            return
        else: # is an access_token
            user = db.auth.get_user(token)
            if user is None: raise HTTPException(status_code=401, detail="Unauthorized")
            return
    except HTTPException as e:
        raise e
    except AuthApiError as e:
        raise HTTPException(status_code=401, detail="Unauthorized")
    except Exception as e:
        traceback.print_exc()
        print(e)
        raise HTTPException(status_code=500, detail="Server Error")
