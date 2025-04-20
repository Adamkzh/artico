import boto3
import os
from botocore.exceptions import NoCredentialsError, ClientError

AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID', 'your-access-key')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY', 'your-secret-key')
AWS_REGION = os.getenv('AWS_REGION', 'us-east-2')
S3_BUCKET_NAME = os.getenv('S3_BUCKET_NAME', 'rubico-generated-audio')

s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION,
    endpoint_url=f"https://s3.{AWS_REGION}.amazonaws.com"
)

def upload_file_and_get_presigned_url(file_bytes: bytes, object_key: str, expiration_seconds: int = 600) -> str:
    """
    Uploads file bytes to S3 and returns a pre-signed URL.

    Args:
        file_bytes (bytes): The file content.
        object_key (str): S3 object key (folder/filename.ext).
        expiration_seconds (int): How long the presigned URL is valid, in seconds.

    Returns:
        str: A pre-signed URL to access the uploaded file.
    """
    try:
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=object_key,
            Body=file_bytes,
            ContentType="audio/mpeg",
        )

        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': S3_BUCKET_NAME, 'Key': object_key},
            ExpiresIn=expiration_seconds
        )

        return presigned_url

    except NoCredentialsError:
        raise Exception("AWS credentials not found.")
    except ClientError as e:
        raise Exception(f"Failed to upload or generate URL: {e}")


