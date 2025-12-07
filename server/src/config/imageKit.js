import ImageKit from "imagekit";

let imagekitInstance = null;

export const getImageKit = () => {
    if (!imagekitInstance) {
        imagekitInstance = new ImageKit({
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
            urlEndpoint: process.env.IMAGEKIT_URL
        });
    }
    return imagekitInstance;
};
