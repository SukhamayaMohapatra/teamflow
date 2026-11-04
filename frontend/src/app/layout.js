
import Providers from './providers';

export const metadata = {
  title: 'TeamFlow | Project Management',
  description: 'Project and task management workspace',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#F7F8FC' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
