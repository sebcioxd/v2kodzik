import NextTopLoader from "nextjs-toploader";


export default function Toploader() {
    return (
        <NextTopLoader 
        color="#e4e4e7"
        height={1}
        showSpinner={false}
        initialPosition={0.2}
        shadow={false}
        zIndex={9999}
        />
    )
}