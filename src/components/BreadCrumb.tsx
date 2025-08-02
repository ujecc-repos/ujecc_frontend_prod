import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

const Breadcrumb = () => {
  const location = useLocation();

  // Generate breadcrumb items from the current path
  const generateBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    return paths.map((path, index) => {
      const url = `/${paths.slice(0, index + 1).join('/')}`;
      return {
        name: path.charAt(0).toUpperCase() + path.slice(1),
        href: url,
        current: index === paths.length - 1
      };
    });
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className="flex items-center space-x-2 text-sm font-medium text-gray-400">
      <Link
        to="/"
        className="hover:text-indigo-600  transition-colors duration-200"
      >
        Dassnet
      </Link>
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.href} className="flex items-center">
          <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-1" aria-hidden="true" />
          {breadcrumb.current ? (
            <span className="text-indigo-600 font-semibold">{breadcrumb.name}</span>
          ) : (
            <Link
              to={breadcrumb.href}
              className="hover:text-indigo-600 transition-colors duration-200"
            >
              {breadcrumb.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumb;