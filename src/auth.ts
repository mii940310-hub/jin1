import NextAuth from "next-auth";
import KakaoProvider from "next-auth/providers/kakao";

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        KakaoProvider({
            clientId: process.env.KAKAO_CLIENT_ID || "",
            clientSecret: process.env.KAKAO_CLIENT_SECRET || "",
        }),
    ],
});
