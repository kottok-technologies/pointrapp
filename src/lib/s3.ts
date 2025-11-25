import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { fromSSO } from "@aws-sdk/credential-provider-sso";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const isLocalhost =
    process.env.HOSTNAME === "localhost" ||
    process.env.HOST === "localhost" ||
    process.env.NODE_ENV === "development";

// Dynamically configure the client
const getS3Client = () => {
    if (isLocalhost) {
        return new S3Client({
            region: process.env.AWS_REGION,
            credentials: fromSSO({
                profile: process.env.AWS_PROFILE_NAME,
            }),
        });
    }
    return new S3Client({
        region: process.env.AWS_REGION,
    });
};

const s3 = getS3Client();

export async function uploadAvatar(bucket: string, key: string, contentType: string): Promise<string> {
    const putCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
    });

    return await getSignedUrl(s3, putCommand, {
        expiresIn: 60, // seconds
    });
}