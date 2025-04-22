import os
import time
import uuid
import boto3
from botocore.exceptions import NoCredentialsError, ClientError
from typing import Optional

# Environment config
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID', 'your-access-key')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY', 'your-secret-key')
AWS_REGION = os.getenv('AWS_REGION', 'us-east-2')
S3_BUCKET_NAME = os.getenv('S3_BUCKET_NAME', 'rubico-generated-audio')

# Initialize S3 client
try:
    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION,
        endpoint_url=f"https://s3.{AWS_REGION}.amazonaws.com"
    )
except Exception as e:
    raise RuntimeError(f"Failed to initialize S3 client: {e}")

def generate_object_key(
    session_id: str,
    prefix: str = "sessions",
    extension: str = "mp3"
) -> str:
    """
    Generate a standardized S3 object key for storing audio files.

    Args:
        session_id (str): Unique session identifier.
        prefix (str): Optional top-level folder in S3 (default: 'sessions').
        extension (str): File extension without the leading dot (default: 'mp3').

    Returns:
        str: An S3 object key like 'sessions/{session_id}/{timestamp}.mp3'.
    """
    timestamp = int(time.time())
    return f"{prefix}/{session_id}/{timestamp}.{extension}"

def upload_file_and_get_presigned_url(
    file_bytes: bytes,
    session_id: str,
    expiration_seconds: int = 300,
    content_type: str = "audio/mpeg",
    bucket_name: Optional[str] = None
) -> str:
    """
    Uploads file bytes to S3 and returns a pre-signed URL.

    Args:
        file_bytes (bytes): The file content.
        session_id (str): Session ID to organize files in S3.
        expiration_seconds (int): How long the pre-signed URL is valid (default: 300 seconds).
        content_type (str): MIME type of the file (default: "audio/mpeg").
        bucket_name (Optional[str]): Optionally override the default bucket.

    Returns:
        str: A pre-signed URL to access the uploaded file.
    """
    bucket = bucket_name or S3_BUCKET_NAME
    object_key = generate_object_key(session_id)

    try:
        s3_client.put_object(
            Bucket=bucket,
            Key=object_key,
            Body=file_bytes,
            ContentType=content_type,
        )

        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': object_key},
            ExpiresIn=expiration_seconds
        )
        return presigned_url

    except NoCredentialsError:
        raise Exception("AWS credentials not found. Please check your environment variables.")
    except ClientError as e:
        raise Exception(f"Failed to upload or generate URL: {e}")
