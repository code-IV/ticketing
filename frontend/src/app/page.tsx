import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Ticket, Calendar, Shield, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Welcome to Bora Amusement Park
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Ethiopia's Premier Entertainment Destination
            </p>
            <p className="text-lg mb-10 max-w-2xl mx-auto text-blue-50">
              Skip the lines and book your tickets online. Experience thrilling
              rides, family fun, and unforgettable memories at Bora Park.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/events">
                <Button
                  size="lg"
                  variant="ghost"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  <Ticket className="mr-2 h-5 w-5" />
                  Book Tickets Now
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="lg"
                  variant="ghost"
                  className="border-2 border-white text-white hover:bg-white/10"
                >
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Why Book Online?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                Skip the Queue
              </h3>
              <p className="text-gray-600">
                Book online and go straight to the entrance. No waiting in long
                ticket lines.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                Plan Ahead
              </h3>
              <p className="text-gray-600">
                Choose your visit date and time in advance. Secure your spot for
                special events.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                Secure Payment
              </h3>
              <p className="text-gray-600">
                Safe and secure online payment with multiple options including
                Telebirr.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">
            Ready for Adventure?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Browse our upcoming events and book your tickets today. Experience
            the thrill!
          </p>
          <Link href="/events">
            <Button size="lg">View All Events</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
