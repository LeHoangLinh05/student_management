// backend/lib/ipfs.js
import axios from "axios";
import FormData from "form-data";

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

if (!PINATA_JWT && !(PINATA_API_KEY && PINATA_API_SECRET)) {
  throw new Error(
    "Please set PINATA_JWT or (PINATA_API_KEY & PINATA_API_SECRET) in .env"
  );
}

export async function uploadBufferToIPFS(buffer, filename, mimeType = "application/pdf") {
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";

  const data = new FormData();
  data.append("file", buffer, { filename, contentType: mimeType });

  const headers = {
    ...data.getHeaders(),
  };

  if (PINATA_JWT) {
    headers.Authorization = `Bearer ${PINATA_JWT}`;
  } else {
    headers.pinata_api_key = PINATA_API_KEY;
    headers.pinata_secret_api_key = PINATA_API_SECRET;
  }

  const res = await axios.post(url, data, {
    maxBodyLength: Infinity,
    headers,
  });

  // Pinata trả về IpfsHash
  const cid = res.data?.IpfsHash;
  if (!cid) {
    throw new Error("Pinata upload failed: missing IpfsHash");
  }

  return cid;
}
