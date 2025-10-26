// This file contains TypeScript type definitions used throughout the project. 
// It may define interfaces and types for props and state used in components.

declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg';

interface Props {
    children?: React.ReactNode;
}

interface HeaderProps extends Props {
    title: string;
}

interface FooterProps {
    year: number;
}

interface HomeProps {
    welcomeMessage: string;
}