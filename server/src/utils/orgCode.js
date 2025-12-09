const ALPHANUM = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // avoid confusing chars

export function generateOrgCode(length = 8) {
    let out = '';
    for (let i = 0; i < length; i++) {
        out += ALPHANUM.charAt(Math.floor(Math.random() * ALPHANUM.length));
    }
    return out;
}


