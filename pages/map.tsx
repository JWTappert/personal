import dynamic from "next/dynamic";

const DynamicComponentWithNoSSR = dynamic(() => import("components/map"), {
  ssr: false,
});

export default () => <DynamicComponentWithNoSSR />;
