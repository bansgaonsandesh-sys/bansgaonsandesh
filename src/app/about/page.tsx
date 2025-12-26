'use client'

import { Card, Typography, Row, Col, Space } from 'antd'
import { siteConfig as SITE_CONFIG } from '@/config/site'
import { 
  UserOutlined, 
  TeamOutlined, 
  GlobalOutlined, 
  HeartOutlined,
  SafetyOutlined,
  ThunderboltOutlined 
} from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

export default function AboutPage() {
  const features = [
    {
      icon: <GlobalOutlined className="text-4xl text-blue-600" />,
      title: 'Local Coverage',
      description: 'Comprehensive coverage of local news, events, and stories from cities across India.',
    },
    {
      icon: <ThunderboltOutlined className="text-4xl text-yellow-600" />,
      title: 'Real-Time Updates',
      description: 'Stay informed with instant updates and breaking news as events unfold in your community.',
    },
    {
      icon: <TeamOutlined className="text-4xl text-green-600" />,
      title: 'Community Driven',
      description: 'A platform built by the community, for the community. Share stories that matter to you.',
    },
    {
      icon: <HeartOutlined className="text-4xl text-red-600" />,
      title: 'Authentic Content',
      description: 'Verified news and authentic stories from real people in your neighborhood.',
    },
    {
      icon: <SafetyOutlined className="text-4xl text-purple-600" />,
      title: 'Safe & Secure',
      description: 'Your privacy and security are our top priorities. We protect your data and respect your trust.',
    },
    {
      icon: <UserOutlined className="text-4xl text-indigo-600" />,
      title: 'User Friendly',
      description: 'Easy to use interface designed for everyone. Share news, engage with community effortlessly.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <Title level={1} className="text-white text-center mb-4">
            About {SITE_CONFIG.name}
          </Title>
          <Paragraph className="text-xl text-blue-100 text-center max-w-3xl mx-auto">
            Your trusted source for local news, community updates, and authentic stories from across India
          </Paragraph>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <Card className="shadow-lg border-0 mb-12">
          <Title level={2} className="text-center mb-6 text-gray-800">
            Our Mission
          </Title>
          <Paragraph className="text-lg text-gray-700 text-center max-w-4xl mx-auto leading-relaxed">
            {SITE_CONFIG.name} is dedicated to connecting communities through authentic, local news coverage. 
            We believe in empowering citizens to share their stories, stay informed about their neighborhoods, 
            and build stronger, more connected communities. Our platform bridges the gap between traditional 
            news media and grassroots journalism, bringing you the stories that matter most to your daily life.
          </Paragraph>
        </Card>

        {/* Features Grid */}
        <Title level={2} className="text-center mb-12 text-gray-800">
          Why Choose {SITE_CONFIG.name}?
        </Title>
        <Row gutter={[24, 24]} className="mb-16">
          {features.map((feature, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <Card 
                className="h-full hover:shadow-xl transition-shadow duration-300 border-0 shadow-md"
                bodyStyle={{ textAlign: 'center', padding: '32px 24px' }}
              >
                <div className="mb-4">{feature.icon}</div>
                <Title level={4} className="mb-3 text-gray-800">
                  {feature.title}
                </Title>
                <Paragraph className="text-gray-600 mb-0">
                  {feature.description}
                </Paragraph>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Values Section */}
        <Card className="shadow-lg border-0 mb-12 bg-gradient-to-br from-blue-50 to-indigo-50">
          <Title level={2} className="text-center mb-8 text-gray-800">
            Our Values
          </Title>
          <Row gutter={[32, 32]}>
            <Col xs={24} md={12}>
              <Space direction="vertical" size="large" className="w-full">
                <div>
                  <Title level={4} className="text-blue-600 mb-2">
                    🎯 Authenticity
                  </Title>
                  <Paragraph className="text-gray-700 mb-0">
                    We prioritize genuine, verified news from real people in local communities. 
                    Every story matters, and every voice deserves to be heard.
                  </Paragraph>
                </div>
                <div>
                  <Title level={4} className="text-blue-600 mb-2">
                    🤝 Community First
                  </Title>
                  <Paragraph className="text-gray-700 mb-0">
                    Our platform exists to serve communities. We put local needs, interests, 
                    and concerns at the forefront of everything we do.
                  </Paragraph>
                </div>
                <div>
                  <Title level={4} className="text-blue-600 mb-2">
                    ⚡ Speed & Accuracy
                  </Title>
                  <Paragraph className="text-gray-700 mb-0">
                    We deliver news fast without compromising on accuracy. Real-time updates 
                    that you can trust and rely on.
                  </Paragraph>
                </div>
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Space direction="vertical" size="large" className="w-full">
                <div>
                  <Title level={4} className="text-blue-600 mb-2">
                    🔒 Privacy & Security
                  </Title>
                  <Paragraph className="text-gray-700 mb-0">
                    Your data is yours. We implement robust security measures and never 
                    compromise on user privacy or data protection.
                  </Paragraph>
                </div>
                <div>
                  <Title level={4} className="text-blue-600 mb-2">
                    🌟 Transparency
                  </Title>
                  <Paragraph className="text-gray-700 mb-0">
                    We operate with complete transparency in our news coverage, content 
                    moderation, and community guidelines.
                  </Paragraph>
                </div>
                <div>
                  <Title level={4} className="text-blue-600 mb-2">
                    🚀 Innovation
                  </Title>
                  <Paragraph className="text-gray-700 mb-0">
                    Continuously evolving our platform with new features and technologies 
                    to better serve our growing community.
                  </Paragraph>
                </div>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Contact Section */}
        <Card className="shadow-lg border-0 text-center">
          <Title level={2} className="mb-6 text-gray-800">
            Get In Touch
          </Title>
          <Paragraph className="text-lg text-gray-700 mb-8">
            Have questions, suggestions, or want to partner with us? We'd love to hear from you!
          </Paragraph>
          <Space direction="vertical" size="middle" className="w-full">
            <div>
              <Text strong className="text-gray-800">Email:</Text>{' '}
              <a href={`mailto:${SITE_CONFIG.contact.email}`} className="text-blue-600 hover:text-blue-700">
                {SITE_CONFIG.contact.email}
              </a>
            </div>
            {SITE_CONFIG.contact.phone && (
              <div>
                <Text strong className="text-gray-800">Phone:</Text>{' '}
                <a href={`tel:${SITE_CONFIG.contact.phone}`} className="text-blue-600 hover:text-blue-700">
                  {SITE_CONFIG.contact.phone}
                </a>
              </div>
            )}
            {SITE_CONFIG.contact.address && (
              <div>
                <Text strong className="text-gray-800">Address:</Text>{' '}
                <Text className="text-gray-700">{SITE_CONFIG.contact.address}</Text>
              </div>
            )}
          </Space>
          
          <div className="mt-8 pt-8 border-t border-gray-200">
            <Space size="large" className="justify-center flex-wrap">
              {SITE_CONFIG.social.facebook && (
                <a 
                  href={SITE_CONFIG.social.facebook} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-lg"
                >
                  Facebook
                </a>
              )}
              {SITE_CONFIG.social.twitter && (
                <a 
                  href={SITE_CONFIG.social.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-500 text-lg"
                >
                  Twitter
                </a>
              )}
              {SITE_CONFIG.social.instagram && (
                <a 
                  href={SITE_CONFIG.social.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-pink-600 hover:text-pink-700 text-lg"
                >
                  Instagram
                </a>
              )}
              {SITE_CONFIG.social.youtube && (
                <a 
                  href={SITE_CONFIG.social.youtube} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-red-600 hover:text-red-700 text-lg"
                >
                  YouTube
                </a>
              )}
            </Space>
          </div>
        </Card>
      </div>

      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: SITE_CONFIG.name,
            url: SITE_CONFIG.url,
            logo: `${SITE_CONFIG.url}${SITE_CONFIG.images.logo}`,
            description: SITE_CONFIG.description,
            email: SITE_CONFIG.contact.email,
            address: SITE_CONFIG.contact.address ? {
              '@type': 'PostalAddress',
              addressLocality: 'India',
              addressCountry: 'IN',
            } : undefined,
            sameAs: [
              SITE_CONFIG.social.facebook,
              SITE_CONFIG.social.twitter,
              SITE_CONFIG.social.instagram,
              SITE_CONFIG.social.youtube,
            ].filter(Boolean),
          }),
        }}
      />
    </div>
  )
}
