import ResponsiveHeader from "../../components/Header/ResponsiveHeader";
import Footer from "../../components/Footer/Footer";
import QuoteProviders from "../../components/QuoteProviders/QuoteProviders";

export default function QuoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QuoteProviders>
      <ResponsiveHeader />
      {children}
      <Footer />
    </QuoteProviders>
  );
}
