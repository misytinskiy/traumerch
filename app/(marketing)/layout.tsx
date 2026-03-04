import ResponsiveHeader from "../../components/Header/ResponsiveHeader";
import CTA from "../../components/CTA/CTA";
import Footer from "../../components/Footer/Footer";
import MarketingExtras from "../../components/MarketingExtras/MarketingExtras";
import MarketingProviders from "../../components/MarketingProviders/MarketingProviders";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MarketingProviders>
      <ResponsiveHeader />
      {children}
      <CTA />
      <Footer />
      <MarketingExtras />
    </MarketingProviders>
  );
}
