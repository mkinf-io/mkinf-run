import traceback

from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from gotrue.errors import AuthApiError

from src.utils.db_client import get_db, DBClient
from typing import Optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def check_auth(token: str = Depends(oauth2_scheme), db: Optional[DBClient] = Depends(get_db)) -> str:
    try:
        if db is None: raise HTTPException(status_code=500, detail="Server Error")
        if token is None: raise HTTPException(status_code=401, detail="Unauthorized")
        is_org_key = token.startswith("sk-org-")
        if is_org_key: # is an org key
            res = (db.table("org_keys")
                   .select()
                   .eq("value", token)
                   .execute())
            if res is None or len(res.data) == 0: raise HTTPException(status_code=401, detail="Unauthorized")
            return res.data[0]["id"]
        else: # is an access_token
            raise HTTPException(status_code=401, detail="Unauthorized - You need an organization API key")
    except HTTPException as e:
        raise e
    except AuthApiError:
        raise HTTPException(status_code=401, detail="Unauthorized")
    except Exception as e:
        traceback.print_exc()
        print(e)
        raise HTTPException(status_code=500, detail="Server Error")
