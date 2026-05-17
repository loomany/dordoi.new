export const YANDEX_WEBMASTER_VERIFICATION_ID = "6f019bfe91ae7f56";

/** Exact bytes Yandex expects in the root HTML verification file. */
export const YANDEX_WEBMASTER_VERIFICATION_HTML = `<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    </head>
    <body>Verification: ${YANDEX_WEBMASTER_VERIFICATION_ID}</body>
</html>
`;
