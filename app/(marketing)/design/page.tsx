import DesignPage from "../../../features/design/DesignPage";

export const revalidate = 300;

export default function Page(props: { searchParams?: Promise<{ product?: string }> }) {
  return <DesignPage {...props} />;
}
